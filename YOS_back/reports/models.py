from django.db import models
from django.db import transaction

class ReportCacheMeta(models.Model):
    """Stores the current version for financial report caches."""
    version = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name_plural = "Report cache meta"

    @classmethod
    def get_current_version(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'version': 1})
        return obj.version

    @classmethod
    @transaction.atomic
    def increment_version(cls):
        obj = cls.objects.select_for_update().get(pk=1)
        obj.version += 1
        obj.save()
        return obj.version